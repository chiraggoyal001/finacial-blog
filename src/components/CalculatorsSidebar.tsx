import React, { useState } from 'react';
import { 
  Calculator, 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  Coins, 
  Info,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

export const CalculatorsSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // SIP Calculator State
  const [monthlySip, setMonthlySip] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // Compound Interest State
  const [principal, setPrincipal] = useState(100000);
  const [ciRate, setCiRate] = useState(10);
  const [ciYears, setCiYears] = useState(5);

  const calculateSip = () => {
    const i = (sipRate / 100) / 12;
    const n = sipYears * 12;
    const totalValue = monthlySip * (((Math.pow(1 + i, n)) - 1) / i) * (1 + i);
    const invested = monthlySip * n;
    return {
      total: Math.round(totalValue),
      invested: Math.round(invested),
      returns: Math.round(totalValue - invested)
    };
  };

  const calculateCi = () => {
    const totalValue = principal * Math.pow((1 + ciRate / 100), ciYears);
    return {
      total: Math.round(totalValue),
      invested: principal,
      returns: Math.round(totalValue - principal)
    };
  };

  const sipResult = calculateSip();
  const ciResult = calculateCi();

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-[55] bg-primary text-primary-foreground p-3 rounded-l-2xl shadow-2xl transition-transform duration-300 hover:-translate-x-1 ${isOpen ? 'translate-x-full' : 'translate-x-0'}`}
        aria-label="Open Calculators"
      >
        <Calculator className="h-5 w-5 animate-pulse" />
        <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold uppercase tracking-widest mt-2">Tools</span>
      </button>

      {/* Sidebar Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-[350px] bg-background border-l border-border shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[100] transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display font-bold text-lg">Financial Tools</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <Tabs defaultValue="sip" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="sip">SIP Plan</TabsTrigger>
                <TabsTrigger value="ci">Lumpsum</TabsTrigger>
              </TabsList>

              <TabsContent value="sip" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>Monthly Investment</Label>
                      <span className="font-bold text-primary">₹{monthlySip.toLocaleString()}</span>
                    </div>
                    <Slider value={[monthlySip]} min={500} max={100000} step={500} onValueChange={(val) => setMonthlySip(val[0])} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>Expected Return (p.a)</Label>
                      <span className="font-bold text-primary">{sipRate}%</span>
                    </div>
                    <Slider value={[sipRate]} min={1} max={30} step={0.5} onValueChange={(val) => setSipRate(val[0])} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>Time Period (Years)</Label>
                      <span className="font-bold text-primary">{sipYears}y</span>
                    </div>
                    <Slider value={[sipYears]} min={1} max={40} step={1} onValueChange={(val) => setSipYears(val[0])} />
                  </div>
                </div>

                {/* Results */}
                <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <TrendingUp className="h-12 w-12" />
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Invested</p>
                        <p className="text-sm font-bold">₹{sipResult.invested.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Returns</p>
                        <p className="text-sm font-bold text-green-600">₹{sipResult.returns.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-primary/10">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold text-center">Total Value</p>
                      <p className="text-2xl font-black text-primary text-center">₹{sipResult.total.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ci" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Initial Principal</Label>
                    <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>Interest Rate (%)</Label>
                      <span className="font-bold text-primary">{ciRate}%</span>
                    </div>
                    <Slider value={[ciRate]} min={1} max={25} step={0.5} onValueChange={(val) => setCiRate(val[0])} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>Duration (Years)</Label>
                      <span className="font-bold text-primary">{ciYears}y</span>
                    </div>
                    <Slider value={[ciYears]} min={1} max={30} step={1} onValueChange={(val) => setCiYears(val[0])} />
                  </div>
                </div>

                <Card className="bg-secondary/5 border-secondary/20">
                  <CardContent className="p-4 space-y-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Maturity Value</p>
                    <p className="text-2xl font-black text-secondary">₹{ciResult.total.toLocaleString()}</p>
                    <div className="flex justify-between text-xs pt-2 border-t">
                      <span>Returns: ₹{ciResult.returns.toLocaleString()}</span>
                      <span className="text-muted-foreground">({Math.round((ciResult.returns / principal) * 100)}% gain)</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="rounded-xl p-4 bg-muted/50 border flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                These calculators provide estimates based on the inputs provided. Actual market returns may vary based on performance.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-4 bg-muted/30 border-t">
            <p className="text-[10px] text-center mb-2 font-medium">Ready to start your journey?</p>
            <Link to="/modules" onClick={() => setIsOpen(false)}>
              <Button className="w-full text-xs h-9">
                View Learning Modules <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[50] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
