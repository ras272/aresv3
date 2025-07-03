'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { InventoryLayout } from '@/components/layout/InventoryLayout'
import { supabase } from '@/lib/supabase'
import { 
  Package,
  Search,
  Upload,
  Plus,
  FolderOpen,
  Grid3X3,
  MoreHorizontal,
  SortAsc,
  Users
} from 'lucide-react'

interface BrandFolder {
  id: string
  name: string
  image: string
  itemCount: number
  totalUnits: number
  totalValue: number
  description: string
}

export default function ItemsPage() {
  const [folders, setFolders] = useState<BrandFolder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [groupItems, setGroupItems] = useState(true)

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    setLoading(true)
    try {
      // Cargar datos de componentes
      const { data: componentes } = await supabase
        .from('componentes_disponibles')
        .select('*')
        .limit(100)

      // Agrupar por marca
      const marcasMap = new Map()
      
      componentes?.forEach((comp: any) => {
        const marca = comp.marca || 'Sin Marca'
        if (!marcasMap.has(marca)) {
          marcasMap.set(marca, {
            items: [],
            totalUnits: 0,
            totalValue: 0
          })
        }
        
        const data = marcasMap.get(marca)
        data.items.push(comp)
        data.totalUnits += comp.cantidad_disponible || 0
        
        // Calcular valor estimado
        let unitPrice = 1000
        if (comp.nombre?.toLowerCase().includes('ultraformer')) unitPrice = 1500
        if (comp.nombre?.toLowerCase().includes('hydrafacial')) unitPrice = 2000
        if (comp.nombre?.toLowerCase().includes('venus')) unitPrice = 1200
        if (comp.nombre?.toLowerCase().includes('cm')) unitPrice = 800
        if (comp.nombre?.toLowerCase().includes('candela')) unitPrice = 1800
        if (comp.nombre?.toLowerCase().includes('ecleris')) unitPrice = 1300
        if (comp.nombre?.toLowerCase().includes('lumenis')) unitPrice = 1600
        
        data.totalValue += unitPrice * (comp.cantidad_disponible || 0)
      })

      // Convertir a array de folders
      const foldersArray: BrandFolder[] = Array.from(marcasMap.entries()).map(([marca, data]: [string, any]) => ({
        id: `brand-${marca.toLowerCase().replace(/\s+/g, '-')}`,
        name: marca,
        image: getBrandImage(marca),
        itemCount: data.items.length,
        totalUnits: data.totalUnits,
        totalValue: data.totalValue,
        description: `${data.items.length} productos disponibles`
      }))

      // Ordenar por valor total (descendente)
      foldersArray.sort((a, b) => b.totalValue - a.totalValue)

      setFolders(foldersArray)

    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBrandImage = (marca: string) => {
    const brandImages: { [key: string]: string } = {
      'CLASSYS': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
      'HYDRAFACIAL': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      'VENUS': 'https://images.unsplash.com/photo-1587370560942-ad2a04eacfe4?w=400&h=300&fit=crop',
      'CANDELA': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      'ECLERIS': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      'LUMENIS': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
      'BRERA': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      'THERMAGE': 'https://images.unsplash.com/photo-1587370560942-ad2a04eacfe4?w=400&h=300&fit=crop'
    }

    // Buscar coincidencia exacta o parcial
    for (const [key, image] of Object.entries(brandImages)) {
      if (marca.toUpperCase().includes(key)) {
        return image
      }
    }

    // Imagen por defecto
    return 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=300&fit=crop'
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `USD ${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `USD ${(value / 1000).toFixed(1)}K`
    } else {
      return `USD ${value.toFixed(0)}`
    }
  }

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalFolders = folders.length
  const totalItems = folders.reduce((sum, folder) => sum + folder.itemCount, 0)
  const totalQuantity = folders.reduce((sum, folder) => sum + folder.totalUnits, 0)
  const totalValue = folders.reduce((sum, folder) => sum + folder.totalValue, 0)

  if (loading) {
    return (
      <InventoryLayout title="All Items" subtitle="Gestión de productos por marcas">
        <div className="p-8 space-y-8">
          {/* Loading Header */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-80 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="h-12 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
              <div className="flex space-x-3">
                <div className="h-12 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="h-12 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Loading Stats */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/60">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="text-center">
                  <div className="h-8 w-16 bg-slate-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 w-12 bg-slate-200 rounded mx-auto animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <Card key={i} className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-white to-slate-50 animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-square bg-slate-200"></div>
                  <div className="p-5 space-y-4">
                    <div className="h-6 bg-slate-200 rounded-lg"></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-14 bg-slate-200 rounded-xl"></div>
                      <div className="h-14 bg-slate-200 rounded-xl"></div>
                      <div className="h-14 bg-slate-200 rounded-xl"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </InventoryLayout>
    )
  }

  return (
    <InventoryLayout title="All Items" subtitle="Gestión de productos por marcas">
      <div className="p-8 space-y-8">
        {/* Header Controls */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div className="flex items-center space-x-6 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder:text-gray-400"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="h-12 px-4 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200">
                  <Package className="h-4 w-4 mr-3" />
                  <span className="font-medium">Group Items</span>
                  <div className="ml-3">
                    <div className={`w-10 h-5 rounded-full transition-colors ${groupItems ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${groupItems ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5 shadow-sm`}></div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" size="sm" className="h-12 px-4 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200">
                  <span className="font-medium">Updated At</span>
                  <SortAsc className="h-4 w-4 ml-2" />
                </Button>
                
                <Button variant="outline" size="sm" className="h-12 px-4 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200">
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="h-12 px-6 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium">
                <Plus className="h-4 w-4 mr-2" />
                ADD ITEM
              </Button>
              <Button className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 font-medium">
                <FolderOpen className="h-4 w-4 mr-2" />
                ADD FOLDER
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{totalFolders}</div>
              <div className="text-sm font-medium text-gray-600">Folders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
              <div className="text-sm font-medium text-gray-600">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{totalQuantity.toLocaleString()}</div>
              <div className="text-sm font-medium text-gray-600">Total Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValue)}</div>
              <div className="text-sm font-medium text-gray-600">Total Value</div>
            </div>
          </div>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
          {filteredFolders.map((folder) => (
            <Card key={folder.id} className="shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer overflow-hidden bg-white">
              <CardContent className="p-0">
                {/* Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden relative">
                  <img 
                    src={folder.image} 
                    alt={folder.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200"></div>
                  <div className="absolute top-4 right-4 bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <FolderOpen className="h-4 w-4 text-gray-700" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors duration-200">{folder.name}</h3>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <Package className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-sm font-bold text-blue-900">{folder.itemCount}</div>
                      <div className="text-xs text-blue-600">Items</div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <Users className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-sm font-bold text-purple-900">{folder.totalUnits}</div>
                      <div className="text-xs text-purple-600">Units</div>
                    </div>
                    
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                      <div className="text-sm font-bold text-emerald-900">{formatCurrency(folder.totalValue)}</div>
                      <div className="text-xs text-emerald-600">Value</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredFolders.length === 0 && !loading && (
          <Card className="shadow-lg bg-white">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {searchQuery ? 'No folders found' : 'No folders yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                {searchQuery 
                  ? `No folders match "${searchQuery}". Try a different search term or browse all folders.`
                  : 'Get started by creating your first folder to organize your inventory items by brand or category.'
                }
              </p>
              {!searchQuery && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium">
                  <FolderOpen className="h-5 w-5 mr-3" />
                  Create First Folder
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </InventoryLayout>
  )
} 