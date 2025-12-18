// components/AttendanceChart.tsx
import { Paper, Typography, Box } from "@mui/material";
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
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography align="center" fontWeight="medium" gutterBottom>
        {title}
      </Typography>
      <Box height={300}>
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
    </Paper>
  );
};

export default AttendanceChart;
