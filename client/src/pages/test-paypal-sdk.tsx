import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import PayPalButton from "@/components/payment/PayPalButton";

export default function TestPayPalSDK() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSuccess = () => {
    setTestResult("Paiement réussi !");
    toast({
      title: "Succès",
      description: "Le paiement a été traité avec succès.",
    });
  };

  const handleError = (error: string) => {
    setTestResult(`Erreur: ${error}`);
    toast({
      title: "Erreur",
      description: error,
      variant: "destructive"
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Test PayPal SDK</h1>
        <p>Vous devez être connecté pour tester le SDK PayPal.</p>
        <a href="/login" className="text-blue-500 hover:underline">
          Cliquez ici pour vous connecter
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test PayPal SDK v6</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Informations utilisateur</h2>
        <p><strong>Nom:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test de paiement PayPal</h2>
        <p className="mb-4">
          Cliquez sur le bouton ci-dessous pour tester l'intégration du SDK PayPal v6.
        </p>
        
        <div className="border rounded p-4 mb-4">
          <h3 className="font-medium mb-2">Plan de test: Basic (2000 FCFA)</h3>
          <PayPalButton
            planId="basic"
            amount={2000}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
        
        {testResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-medium">Résultat du test:</p>
            <p>{testResult}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Documentation SDK PayPal v6</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Le SDK est chargé dynamiquement depuis https://www.sandbox.paypal.com/web-sdk/v6/core</li>
          <li>Il utilise un clientToken généré côté serveur pour l'authentification</li>
          <li>Le bouton PayPal est créé avec les options de personnalisation appropriées</li>
          <li>Les événements de paiement sont gérés (approbation, annulation, erreur)</li>
          <li>Le SDK prend en charge plusieurs modes de présentation (popup, modal)</li>
        </ul>
      </div>
    </div>
  );
}