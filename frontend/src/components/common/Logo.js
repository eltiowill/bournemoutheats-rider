import React from 'react';

function Logo({ className = "h-12 w-auto", showText = true }) {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Circular Logo Container */}
      <div className="flex-shrink-0 relative">
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          {/* Central Graphic - Rider on Scooter */}
          <div className="relative w-8 h-8">
            {/* Scooter Body */}
            <div className="absolute bottom-1 left-2 w-4 h-2 bg-white rounded-full"></div>
            {/* Rider Helmet */}
            <div className="absolute top-1 left-3 w-2 h-2 bg-white rounded-full"></div>
            {/* Rider Body */}
            <div className="absolute top-2 left-3 w-1 h-2 bg-white rounded"></div>
            {/* Delivery Box */}
            <div className="absolute bottom-2 right-1 w-2 h-2 bg-white rounded border border-gray-300">
              {/* Mini Logo on Box */}
              <div className="w-1 h-1 bg-white rounded-full mx-auto mt-0.5"></div>
            </div>
            {/* Scooter Handlebar */}
            <div className="absolute top-0 left-2 w-3 h-1 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* Curved Text Elements */}
        {showText && (
          <>
            {/* Top Curved Text - "BOURNEMOUTH EATS" */}
            <div className="absolute -top-2 -left-8 w-32 h-8 overflow-hidden">
              <div className="text-xs font-bold text-white transform -rotate-12 origin-left">
                BOURNEMOUTH
              </div>
            </div>
            <div className="absolute -top-2 -right-8 w-32 h-8 overflow-hidden">
              <div className="text-xs font-bold text-white transform rotate-12 origin-right text-right">
                EATS
              </div>
            </div>
            
            {/* Bottom Text - "SINCE 2025" and "RIDER" */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
              <div className="text-xs font-bold text-white">SINCE 2025</div>
              <div className="text-lg font-bold text-white logo-text">RIDER</div>
            </div>
          </>
        )}
      </div>
      
      {/* Horizontal Logo Text */}
      {showText && (
        <div className="ml-3">
          <div className="text-xl font-bold text-gray-900 logo-text">BournemouthEats</div>
          <div className="text-sm text-gray-600 font-medium">Rider Portal</div>
        </div>
      )}
    </div>
  );
}

export default Logo;
