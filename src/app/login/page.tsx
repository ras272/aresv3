"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  EyeOff,
  LogIn,
  User,
  Lock,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  validatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthPercentage,
} from "@/lib/crypto";
import { z } from "zod";

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Formato de email inválido")
    .max(255, "Email demasiado largo"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .max(128, "Contraseña demasiado larga"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    isLoading: authLoading,
    error: authError,
    clearError,
    isAuthenticated,
  } = useAuth();

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security feedback state
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    isLimited: boolean;
    remainingTime: number;
    remainingAttempts: number;
  } | null>(null);
  const [lockoutInfo, setLockoutInfo] = useState<{
    isLocked: boolean;
    remainingTime: number;
  } | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle countdown timers for rate limiting and lockout
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (rateLimitInfo?.isLimited && rateLimitInfo.remainingTime > 0) {
      interval = setInterval(() => {
        setRateLimitInfo((prev) => {
          if (!prev || prev.remainingTime <= 1) {
            return null;
          }
          return {
            ...prev,
            remainingTime: prev.remainingTime - 1,
          };
        });
      }, 1000);
    }

    if (lockoutInfo?.isLocked && lockoutInfo.remainingTime > 0) {
      interval = setInterval(() => {
        setLockoutInfo((prev) => {
          if (!prev || prev.remainingTime <= 1) {
            return null;
          }
          return {
            ...prev,
            remainingTime: prev.remainingTime - 1,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rateLimitInfo, lockoutInfo]);

  // Validate form data
  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof ValidationErrors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle input changes
  const handleInputChange = (
    field: keyof LoginFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific errors
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear auth errors
    if (authError) {
      clearError();
    }

    // Show password strength indicator when typing password
    if (field === "password" && typeof value === "string") {
      setShowPasswordStrength(value.length > 0);
    }
  };

  // Parse error messages for security feedback
  const parseErrorMessage = (errorMessage: string) => {
    // Rate limiting error
    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many attempts")
    ) {
      const timeMatch = errorMessage.match(/(\d+)\s*minutes?/);
      const attemptsMatch = errorMessage.match(/(\d+)\s*attempts?/);

      if (timeMatch) {
        setRateLimitInfo({
          isLimited: true,
          remainingTime: parseInt(timeMatch[1]) * 60,
          remainingAttempts: attemptsMatch ? parseInt(attemptsMatch[1]) : 0,
        });
      }
    }

    // Account lockout error
    if (errorMessage.includes("locked") || errorMessage.includes("blocked")) {
      const timeMatch = errorMessage.match(/(\d+)\s*minutes?/);

      if (timeMatch) {
        setLockoutInfo({
          isLocked: true,
          remainingTime: parseInt(timeMatch[1]) * 60,
        });
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (rateLimitInfo?.isLimited || lockoutInfo?.isLocked) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(formData.email, formData.password, formData.rememberMe);

      toast.success("Login exitoso", {
        description: "Bienvenido al sistema Ares Tech",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error de autenticación";

      // Parse error for security feedback
      parseErrorMessage(errorMessage);

      // Set general error
      setErrors({ general: errorMessage });

      toast.error("Error de autenticación", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get password strength for display
  const passwordStrength = formData.password
    ? validatePasswordStrength(formData.password)
    : null;

  // Format time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Check if form is disabled due to security restrictions
  const isFormDisabled =
    authLoading ||
    isSubmitting ||
    rateLimitInfo?.isLimited ||
    lockoutInfo?.isLocked;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border border-gray-100 bg-gray-50/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center">
              <Image
                src="/isologo-ares.png"
                alt="Ares Tech Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Sistema Ares
            </CardTitle>
            <p className="text-gray-600 text-sm">Acceso al sistema</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Security Alerts */}
            <AnimatePresence>
              {lockoutInfo?.isLocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Cuenta bloqueada por seguridad</span>
                      <div className="flex items-center gap-1 text-sm font-mono">
                        <Clock className="h-3 w-3" />
                        {formatTime(lockoutInfo.remainingTime)}
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {rateLimitInfo?.isLimited && !lockoutInfo?.isLocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    variant="destructive"
                    className="border-orange-200 bg-orange-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        Demasiados intentos. Espera{" "}
                        {formatTime(rateLimitInfo.remainingTime)}
                      </span>
                      <div className="text-xs">
                        {rateLimitInfo.remainingAttempts} intentos restantes
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@arestech.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${
                      errors.email ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    disabled={isFormDisabled}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-invalid={!!errors.email}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p
                    id="email-error"
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`pl-10 pr-10 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }`}
                    disabled={isFormDisabled}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    disabled={isFormDisabled}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="password-error"
                    className="text-sm text-red-600"
                    role="alert"
                  >
                    {errors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                <AnimatePresence>
                  {showPasswordStrength &&
                    passwordStrength &&
                    formData.password.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            Fortaleza de contraseña:
                          </span>
                          <span
                            className="font-medium capitalize"
                            style={{
                              color: getPasswordStrengthColor(
                                passwordStrength.strength
                              ),
                            }}
                          >
                            {passwordStrength.strength === "very-strong"
                              ? "Muy fuerte"
                              : passwordStrength.strength === "strong"
                              ? "Fuerte"
                              : passwordStrength.strength === "medium"
                              ? "Media"
                              : "Débil"}
                          </span>
                        </div>
                        <Progress
                          value={getPasswordStrengthPercentage(
                            passwordStrength.score
                          )}
                          className="h-2"
                          style={
                            {
                              "--progress-background": getPasswordStrengthColor(
                                passwordStrength.strength
                              ),
                            } as React.CSSProperties
                          }
                        />
                        {passwordStrength.suggestions.length > 0 &&
                          !passwordStrength.isValid && (
                            <div className="text-xs text-gray-600">
                              <p className="font-medium mb-1">Sugerencias:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {passwordStrength.suggestions
                                  .slice(0, 3)
                                  .map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                  ))}
                              </ul>
                            </div>
                          )}
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    handleInputChange("rememberMe", !!checked)
                  }
                  disabled={isFormDisabled}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-gray-600 cursor-pointer select-none"
                >
                  Recordarme por 30 días
                </Label>
              </div>

              {/* General Error */}
              {(errors.general || authError) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {errors.general || authError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isFormDisabled}
              >
                {isSubmitting || authLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Iniciando sesión...
                  </div>
                ) : lockoutInfo?.isLocked ? (
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Cuenta bloqueada
                  </div>
                ) : rateLimitInfo?.isLimited ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Esperar {formatTime(rateLimitInfo.remainingTime)}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
