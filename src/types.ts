export interface Campaign {
  id: number;
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountCollected: string;
  image: string;
  claimed: boolean;
}

export interface Transaction {
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  type: 'donation' | 'claim';
}
