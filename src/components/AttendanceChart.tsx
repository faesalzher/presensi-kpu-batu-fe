// components/AttendanceChart.tsx
import { Typography, Box, Divider, Card } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface AttendanceChartItem {
  name: string;
  value: number;
  color: string;
}

interface AttendanceChartProps {
  data: AttendanceChartItem[];
  title: string;
}

const AttendanceChart = ({ data, title }: AttendanceChartProps) => {
  const sanitizedData = data.filter((item) => Number(item.value) > 0);
  const total = sanitizedData.reduce((sum, item) => sum + Number(item.value), 0);

  const formatPercentage = (value: number) => {
    if (!total) return "0%";
    const percentage = (value / total) * 100;
    return `${percentage < 10 ? percentage.toFixed(1) : Math.round(percentage)}%`;
  };

  return (
    <Card sx={{ borderRadius: 3 , mb:1}} elevation={1}>
      <Typography sx={{p:1}} align="center" fontWeight="medium" gutterBottom>
        {title}
      </Typography>
      <Divider />
      <Box height={300} sx={{p:2, pt:0}}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={sanitizedData}
              cx="50%"
              cy="50%"
              dataKey="value"
              paddingAngle={2}
              innerRadius={60}
              outerRadius={90}
              label={({ value }) => formatPercentage(Number(value))}
            >
              {sanitizedData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number | string) => {
              const numericValue = Number(value);
              return [`${numericValue} (${formatPercentage(numericValue)})`, "Jumlah"];
            }} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value) => {
                const item = sanitizedData.find((entry) => entry.name === value);
                return item ? `${value} (${item.value})` : value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
};

export default AttendanceChart;
