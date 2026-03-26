type PriceDisplayProps = {
  price: number;
};

export function PriceDisplay({ price }: PriceDisplayProps) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-base text-neutral-600">お支払い金額</span>
      <span className="font-heading text-2xl font-semibold tracking-tight text-accent">
        &yen;{price.toLocaleString()}
        <span className="text-xs font-normal text-neutral-500"> (税込)</span>
      </span>
    </div>
  );
}
