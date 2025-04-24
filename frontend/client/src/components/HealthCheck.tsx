import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const HealthCheck = () => {
  const [status, setStatus] = useState<string>("Checking...");
  const [error, setError] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
          setError(null);
        } else {
          setStatus("Error");
          setError("Could not connect to the API");
        }
      } catch (err) {
        setStatus("Error");
        setError("API not available");
        console.error("Health check error:", err);
      }
    };

    checkHealth();
  }, [apiUrl]);

  return (
    <div className="my-2">
      <div className="text-sm flex items-center space-x-2">
        API Status: 
        <Badge variant={status === "healthy" ? "default" : "destructive"} className="ml-2">
          {status}
        </Badge>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default HealthCheck;