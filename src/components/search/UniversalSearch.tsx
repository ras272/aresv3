'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, MapPin, Wrench, Package, Building2, User, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  type: 'equipo' | 'cliente' | 'mantenimiento' | 'componente' | 'documento';
  title: string;
  subtitle: string;
  description?: string;
  icon: React.ComponentType<any>;
  route: string;
  metadata?: {
    estado?: string;
    fecha?: string;
    ubicacion?: string;
    prioridad?: string;
  };
}

interface UniversalSearchProps {
  placeholder?: string;
  className?: string;
}

export function UniversalSearch({ placeholder = "Buscar equipos, clientes, servicios...", className = "" }: UniversalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { equipos, mantenimientos, componentesDisponibles, loadAllData } = useAppStore();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ares_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegación con teclado
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Función de búsqueda
  const performSearch = (searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Debug: Ver qué datos tenemos
    console.log('🔍 Datos disponibles para búsqueda:', {
      equipos: equipos.length,
      mantenimientos: mantenimientos.length,
      componentesDisponibles: componentesDisponibles.length,
      query: query
    });

    // Buscar en equipos
    equipos.forEach(equipo => {
      const matches = [
        equipo.nombreEquipo?.toLowerCase().includes(query),
        equipo.marca?.toLowerCase().includes(query),
        equipo.modelo?.toLowerCase().includes(query),
        equipo.numeroSerieBase?.toLowerCase().includes(query),
        equipo.cliente?.toLowerCase().includes(query),
        equipo.ubicacion?.toLowerCase().includes(query)
      ].some(Boolean);

      if (matches) {
        const estado = equipo.componentes?.some(c => c.estado === 'Fuera de servicio') 
          ? 'Fuera de servicio'
          : equipo.componentes?.some(c => c.estado === 'En reparacion')
          ? 'En reparación'
          : 'Operativo';

        searchResults.push({
          id: equipo.id,
          type: 'equipo',
          title: equipo.nombreEquipo || 'Equipo sin nombre',
          subtitle: `${equipo.marca} ${equipo.modelo}`,
          description: `${equipo.cliente} - ${equipo.ubicacion}`,
          icon: Wrench,
          route: `/equipo/${equipo.id}`,
          metadata: {
            estado,
            ubicacion: equipo.ubicacion
          }
        });
      }
    });

    // Buscar en mantenimientos
    mantenimientos.forEach(mantenimiento => {
      const equipo = equipos.find(e => e.id === mantenimiento.equipoId);
      const matches = [
        mantenimiento.tipo?.toLowerCase().includes(query),
        mantenimiento.descripcion?.toLowerCase().includes(query),
        mantenimiento.tecnicoAsignado?.toLowerCase().includes(query),
        equipo?.cliente?.toLowerCase().includes(query),
        equipo?.nombreEquipo?.toLowerCase().includes(query)
      ].some(Boolean);

      if (matches) {
        searchResults.push({
          id: mantenimiento.id,
          type: 'mantenimiento',
          title: `${mantenimiento.tipo} - ${equipo?.nombreEquipo || 'Equipo'}`,
          subtitle: mantenimiento.descripcion || 'Sin descripción',
          description: `${equipo?.cliente} - ${mantenimiento.tecnicoAsignado || 'Sin técnico'}`,
          icon: Clock,
          route: `/servtec`,
          metadata: {
            estado: mantenimiento.estado,
            fecha: mantenimiento.fecha,
            prioridad: mantenimiento.prioridad
          }
        });
      }
    });

    // Buscar en componentes
    componentesDisponibles.forEach(componente => {
      const matches = [
        componente.nombre?.toLowerCase().includes(query),
        componente.marca?.toLowerCase().includes(query),
        componente.tipoComponente?.toLowerCase().includes(query),
        componente.numeroSerie?.toLowerCase().includes(query),
        componente.modelo?.toLowerCase().includes(query)
      ].some(Boolean);

      if (matches) {
        searchResults.push({
          id: componente.id,
          type: 'componente',
          title: componente.nombre || 'Componente sin nombre',
          subtitle: `${componente.marca} - ${componente.tipoComponente}`,
          description: `Stock: ${componente.cantidadDisponible} unidades`,
          icon: Package,
          route: `/inventario-tecnico`,
          metadata: {
            estado: componente.cantidadDisponible <= 2 ? 'Stock bajo' : 'Disponible'
          }
        });
      }
    });

    // Buscar clientes únicos
    const clientesUnicos = [...new Set(equipos.map(e => e.cliente).filter(Boolean))];
    clientesUnicos.forEach(cliente => {
      if (cliente.toLowerCase().includes(query)) {
        const equiposCliente = equipos.filter(e => e.cliente === cliente);
        searchResults.push({
          id: `cliente-${cliente}`,
          type: 'cliente',
          title: cliente,
          subtitle: `${equiposCliente.length} equipo${equiposCliente.length !== 1 ? 's' : ''}`,
          description: 'Ver todos los equipos del cliente',
          icon: Building2,
          route: `/clinicas?search=${encodeURIComponent(cliente)}`,
        });
      }
    });

    // Ordenar por relevancia (coincidencias exactas primero)
    return searchResults
      .sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(query) ? 1 : 0;
        const bExact = b.title.toLowerCase().startsWith(query) ? 1 : 0;
        return bExact - aExact;
      })
      .slice(0, 8); // Limitar a 8 resultados
  };

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      const searchResults = performSearch(value);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  // Manejar click en resultado
  const handleResultClick = (result: SearchResult) => {
    // Guardar en búsquedas recientes
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('ares_recent_searches', JSON.stringify(newRecentSearches));

    // Navegar
    router.push(result.route);
    
    // Limpiar
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Manejar búsqueda reciente
  const handleRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery);
    const searchResults = performSearch(recentQuery);
    setResults(searchResults);
    setIsOpen(true);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Obtener color del badge según el tipo
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'equipo': return 'bg-blue-100 text-blue-700';
      case 'mantenimiento': return 'bg-orange-100 text-orange-700';
      case 'componente': return 'bg-green-100 text-green-700';
      case 'cliente': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Obtener color del estado
  const getStatusColor = (estado?: string) => {
    if (!estado) return '';
    switch (estado.toLowerCase()) {
      case 'operativo': return 'text-green-600';
      case 'en reparación': return 'text-yellow-600';
      case 'fuera de servicio': return 'text-red-600';
      case 'stock bajo': return 'text-red-600';
      case 'disponible': return 'text-green-600';
      case 'pendiente': return 'text-orange-600';
      case 'finalizado': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          className="pl-10 pr-10 h-11 text-sm"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="max-h-96 overflow-y-auto shadow-lg border">
              {/* Búsquedas recientes (cuando no hay query) */}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="p-3 border-b">
                  <p className="text-xs font-medium text-gray-500 mb-2">Búsquedas recientes</p>
                  <div className="space-y-1">
                    {recentSearches.map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearch(recent)}
                        className="flex items-center w-full p-2 text-left hover:bg-gray-50 rounded text-sm"
                      >
                        <Clock className="h-3 w-3 text-gray-400 mr-2" />
                        {recent}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultados */}
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={`w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        selectedIndex === index ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <result.icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {result.title}
                            </p>
                            <Badge className={`text-xs ${getBadgeColor(result.type)}`}>
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-1">
                            {result.subtitle}
                          </p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {result.description}
                            </p>
                          )}
                          {result.metadata?.estado && (
                            <p className={`text-xs font-medium mt-1 ${getStatusColor(result.metadata.estado)}`}>
                              {result.metadata.estado}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-6 text-center text-gray-500">
                  <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No se encontraron resultados para "{query}"</p>
                </div>
              ) : null}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}