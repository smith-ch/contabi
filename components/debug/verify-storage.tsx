"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseClient } from "@/lib/supabase"
import { AlertCircle, CheckCircle, HardDrive, RefreshCw } from "lucide-react"
import { STORAGE_BUCKETS } from "@/lib/storage"

export default function VerifyStorage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, boolean>>({})

  const checkStorage = async () => {
    setLoading(true)
    setResults({})

    try {
      // Verificar cada bucket
      for (const [key, bucket] of Object.entries(STORAGE_BUCKETS)) {
        try {
          const { data, error } = await supabaseClient.storage.getBucket(bucket)

          if (error) {
            console.error(`Error al verificar bucket ${bucket}:`, error)
            setResults((prev) => ({ ...prev, [bucket]: false }))
          } else {
            console.log(`Bucket ${bucket} existe:`, data)
            setResults((prev) => ({ ...prev, [bucket]: true }))
          }
        } catch (bucketError) {
          console.error(`Error al verificar bucket ${bucket}:`, bucketError)
          setResults((prev) => ({ ...prev, [bucket]: false }))
        }
      }
    } catch (error) {
      console.error("Error al verificar almacenamiento:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Verificar Almacenamiento
        </CardTitle>
        <CardDescription>Comprueba que los buckets de almacenamiento existen y son accesibles</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={checkStorage} disabled={loading} className="mb-4">
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            "Verificar Buckets"
          )}
        </Button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2 mt-4">
            {Object.entries(results).map(([bucket, exists]) => (
              <div key={bucket} className="flex items-center gap-2">
                {exists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span>
                  Bucket {bucket}: {exists ? "Accesible" : "No accesible"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
