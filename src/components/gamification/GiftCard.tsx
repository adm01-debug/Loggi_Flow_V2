import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Gift } from "lucide-react";

interface GiftCardProps {
  name: string;
  description: string;
  cost: number;
  stock: number;
  onRedeem?: () => void;
  disabled?: boolean;
}

export const GiftCard: React.FC<GiftCardProps> = ({
  name,
  description,
  cost,
  stock,
  onRedeem,
  disabled,
}) => {
  return (
    <Card className="flex flex-col h-full border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-1 text-yellow-500 font-bold">
            <Coins className="w-4 h-4" />
            <span>{cost}</span>
          </div>
        </div>
        <CardTitle className="text-md font-semibold">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="mt-2 text-[10px] font-medium uppercase tracking-wider opacity-60">
          Estoque: {stock} unid.
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full text-xs h-8" 
          onClick={onRedeem}
          disabled={disabled || stock === 0}
        >
          Resgatar
        </Button>
      </CardFooter>
    </Card>
  );
};
