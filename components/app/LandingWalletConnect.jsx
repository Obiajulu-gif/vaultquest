"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WalletConnectionButton from "./WalletConnectionButton";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { 
  Droplets, 
  Shield, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Zap,
  Lock
} from "lucide-react";
import { WALLET_COPY, STELLAR_COPY } from "@/lib/wallets";

interface LandingWalletConnectProps {
  onConnectSuccess?: () => void;
}

export default function LandingWalletConnect({ onConnectSuccess }: LandingWalletConnectProps) {
  const router = useRouter();
  const { state, walletConfig, networkConfig } = useWalletConnection();
  const [isHovered, setIsHovered] = useState(false);

  const handleGetStarted = () => {
    if (state.isConnected) {
      router.push('/app/pools');
    }
  };

  const features = [
    {
      icon: <Shield className="w-5 h-5 text-green-400" />,
      title: "Secure",
      description: "Your keys never leave your wallet"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      title: "Earn Interest",
      description: "Competitive rates on Stellar network"
    },
    {
      icon: <Users className="w-5 h-5 text-purple-400" />,
      title: "Community",
      description: "Join thousands of savers"
    },
  ];

  if (state.isConnected) {
    return (
      <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            {walletConfig?.icon}
          </div>
          <CardTitle className="text-2xl text-white">
            Welcome Back! 🎉
          </CardTitle>
          <p className="text-gray-300 mt-2">
            Connected with {walletConfig?.displayName} on {networkConfig?.displayName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                {feature.icon}
                <div>
                  <div className="text-sm font-medium text-white">{feature.title}</div>
                  <div className="text-xs text-gray-400">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={handleGetStarted}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3"
            size="lg"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <div className="text-center text-xs text-gray-400">
            <CheckCircle className="w-3 h-3 inline mr-1 text-green-400" />
            Wallet securely connected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30 backdrop-blur-sm overflow-hidden relative">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse" />
      
      <CardHeader className="text-center pb-6 relative">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 relative">
          <Droplets className="w-10 h-10 text-white" />
          <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
        </div>
        
        <CardTitle className="text-3xl text-white mb-2">
          Start Your <span className="text-blue-400">Savings Journey</span>
        </CardTitle>
        
        <p className="text-gray-300 text-lg max-w-md mx-auto">
          Connect your Stellar wallet to access high-yield savings pools and prize draws
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
            >
              {feature.icon}
              <div>
                <div className="text-sm font-medium text-white">{feature.title}</div>
                <div className="text-xs text-gray-400">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Wallet Connection */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm mb-4">
              <Lock className="w-4 h-4" />
              Bank-level security with Stellar network
            </div>
          </div>
          
          <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <WalletConnectionButton 
              variant="default"
              size="lg"
              showAddress={false}
              showNetwork={false}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-4 text-lg border-0 shadow-lg"
              onConnectSuccess={onConnectSuccess}
            />
            
            {isHovered && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          <div className="text-center text-xs text-gray-400 space-y-1">
            <p>💡 No installation required for browser wallets</p>
            <p>🔐 Your private keys never leave your device</p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3 h-3 text-yellow-400" />
            Instant Setup
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3 text-green-400" />
            Audited Smart Contracts
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3 h-3 text-blue-400" />
            10K+ Users
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
