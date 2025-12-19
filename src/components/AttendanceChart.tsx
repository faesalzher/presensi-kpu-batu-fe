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

const AttendanceChart = ({ data, title }: any) => {
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
              data={data}
              cx="50%"
              cy="50%"
              dataKey="value"
              paddingAngle={2}
              innerRadius={60}
              outerRadius={90}
              label={({ value }) => `${value}%`}
            >
              {data.map((d: any, i: number) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
};

export default AttendanceChart;
