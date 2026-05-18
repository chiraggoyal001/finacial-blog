import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Info,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSEO } from '@/hooks/useSEO';
import { Link } from 'react-router-dom';

const CalculatorsPage = () => {
  // SIP Calculator State
  const [monthlySip, setMonthlySip] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // Compound Interest State
  const [principal, setPrincipal] = useState(100000);
  const [ciRate, setCiRate] = useState(10);
  const [ciYears, setCiYears] = useState(5);

  useSEO({
    title: 'Financial Calculators',
    description: 'Plan your investments with our free SIP and Lumpsum calculators. Estimate returns, compare options, and make informed decisions.',
  });

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/30 py-12 md:py-20">
          <div className="container text-center max-w-3xl">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Financial <span className="text-primary">Calculators</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Plan your investments with confidence. Use our free calculators to estimate returns and make informed financial decisions.
            </p>
          </div>
        </section>

        {/* Calculators */}
        <section className="container py-12">
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="sip" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="sip">SIP Calculator</TabsTrigger>
                <TabsTrigger value="ci">Lumpsum Calculator</TabsTrigger>
              </TabsList>

              <TabsContent value="sip" className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Systematic Investment Plan
                    </CardTitle>
                    <CardDescription>
                      Calculate the future value of your monthly SIP investments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <Label>Monthly Investment</Label>
                        <span className="font-bold text-primary">₹{monthlySip.toLocaleString()}</span>
                      </div>
                      <Slider value={[monthlySip]} min={500} max={100000} step={500} onValueChange={(val) => setMonthlySip(val[0])} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹500</span>
                        <span>₹1,00,000</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <Label>Expected Return (p.a)</Label>
                        <span className="font-bold text-primary">{sipRate}%</span>
                      </div>
                      <Slider value={[sipRate]} min={1} max={30} step={0.5} onValueChange={(val) => setSipRate(val[0])} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1%</span>
                        <span>30%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <Label>Time Period (Years)</Label>
                        <span className="font-bold text-primary">{sipYears}y</span>
                      </div>
                      <Slider value={[sipYears]} min={1} max={40} step={1} onValueChange={(val) => setSipYears(val[0])} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 Year</span>
                        <span>40 Years</span>
                      </div>
                    </div>

                    {/* Results */}
                    <Card className="bg-primary/5 border-primary/20 overflow-hidden relative mt-6">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <TrendingUp className="h-16 w-16" />
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Invested</p>
                            <p className="text-xl font-bold">₹{sipResult.invested.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Est. Returns</p>
                            <p className="text-xl font-bold text-green-600">₹{sipResult.returns.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-primary/10">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider text-center">Total Value</p>
                          <p className="text-3xl font-black text-primary text-center">₹{sipResult.total.toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ci" className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Lumpsum Investment
                    </CardTitle>
                    <CardDescription>
                      Calculate the maturity value of a one-time lump sum investment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Initial Principal (₹)</Label>
                      <Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="text-lg font-bold" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <Label>Interest Rate (%)</Label>
                        <span className="font-bold text-primary">{ciRate}%</span>
                      </div>
                      <Slider value={[ciRate]} min={1} max={25} step={0.5} onValueChange={(val) => setCiRate(val[0])} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1%</span>
                        <span>25%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <Label>Duration (Years)</Label>
                        <span className="font-bold text-primary">{ciYears}y</span>
                      </div>
                      <Slider value={[ciYears]} min={1} max={30} step={1} onValueChange={(val) => setCiYears(val[0])} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 Year</span>
                        <span>30 Years</span>
                      </div>
                    </div>

                    <Card className="bg-secondary/5 border-secondary/20 mt-6">
                      <CardContent className="p-6 space-y-4 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Maturity Value</p>
                        <p className="text-3xl font-black text-secondary">₹{ciResult.total.toLocaleString()}</p>
                        <div className="flex justify-between text-sm pt-4 border-t border-secondary/10">
                          <span>Invested: <strong>₹{ciResult.invested.toLocaleString()}</strong></span>
                          <span>Returns: <strong className="text-green-600">₹{ciResult.returns.toLocaleString()}</strong></span>
                          <span className="text-muted-foreground">({Math.round((ciResult.returns / principal) * 100)}% gain)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Info note */}
            <div className="rounded-xl p-4 bg-muted/50 border flex gap-3 mt-8">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                These calculators provide estimates based on the inputs provided. Actual market returns may vary based on performance, fees, and other factors. Past performance does not guarantee future returns.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-3">Ready to learn more about investing?</p>
              <Link to="/modules">
                <Button className="gap-2">
                  View Learning Modules <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CalculatorsPage;