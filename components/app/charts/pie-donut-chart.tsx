"use client"

import * as React from "react";
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface Transaction {
  category_name?: string | null;
  amount: number;
  type: string;
  [key: string]: any;
}

interface PieDonutChartProps {
  transactions?: Transaction[];
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))"];

// Process transactions data for the chart
const processChartData = (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Only include expenses for category breakdown
  const expenseTransactions = transactions.filter(t => t.type === 'Expense');
  
  const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
    const category = transaction.category_name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(String(transaction.amount)) || 0;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryTotals)
    .map(([category, value]) => ({
      category,
      value
    }))
    .sort((a, b) => b.value - a.value) // Sort by spending amount descending
    .slice(0, 6); // Limit to top 6 categories for better visualization
};

export function PieDonutChart({ transactions = [] }: PieDonutChartProps) {
  const chartData = React.useMemo(() => processChartData(transactions), [transactions]);
  
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      category: {
        label: "Category",
      },
    };
    
    chartData.forEach((item, index) => {
      config[item.category.toLowerCase().replace(/\s+/g, '')] = {
        label: item.category,
        color: COLORS[index % COLORS.length],
      };
    });
    
    return config;
  }, [chartData]);

  const totalSpending = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <Card className="w-full h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-card">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-border p-6">
        <CardTitle className="text-lg font-semibold text-card-foreground">Category Distribution</CardTitle>
        <CardDescription className="text-muted-foreground">Spending breakdown by category</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-6">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <PieChartIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No expense data available</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-h-[300px]"
          >
            <ResponsiveContainer>
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ 
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))'
                  }}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                  {totalSpending > 0 && (
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x="50%"
                        y="45%"
                        className="fill-foreground text-2xl font-bold"
                      >
                        ${totalSpending.toLocaleString()}
                      </tspan>
                      <tspan
                        x="50%"
                        y="55%"
                        className="fill-muted-foreground text-xs"
                      >
                        Total Expenses
                      </tspan>
                    </text>
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}