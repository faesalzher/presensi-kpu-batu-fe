import { Box, Typography, Paper, Divider } from "@mui/material";
// import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface Props {
  date: string;
  time: string;
  status: "belum" | "sudah";
}

const DateTimeStatusCard = ({ date, time, status }: Props) => {
  const isCheckedIn = status === "sudah";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        // mx: 2,
        overflow: "hidden", // 🔑 biar merah & putih nyatu
        boxShadow: "0 8px 24px rgba(255, 0, 0, 0.08)",
        textAlign:"center"
      }}
    >
      {/* 🔴 HEADER TANGGAL */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          color: "#fff",
          background: "linear-gradient(135deg, #771414 0%, #771414 70%)",
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          {date}
        </Typography>
      </Box>
      <Divider/>

      {/* ⚪ BODY JAM */}
      <Box sx={{ p: 2, bgcolor: "#fff", textAlign: "center" }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" lineHeight={1.1} color="text.primary" sx={{ opacity: 0.95 }}>
            {time}{" "}
            <Typography
              component="span"
              variant="body2"
              color="text.primary"
            >
              WIB
            </Typography>
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="center" mt={0.5}>
            {/* <FiberManualRecordIcon
              sx={{
                fontSize: 10,
                color: isCheckedIn ? "success.main" : "error.main",
                mr: 0.5,
              }}
            /> */}
            <Typography
            sx={{textAlign:"center"}}
              variant="body2"
              color={isCheckedIn ? "success.main" : "error.main"}
            >
              {isCheckedIn ? "Sudah Absen" : "Belum Absen"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default DateTimeStatusCard;
