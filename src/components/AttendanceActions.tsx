// components/AttendanceActions.tsx
import { Grid, Button, Typography, Box, useTheme, ButtonGroup } from "@mui/material";

interface Props {
  onClick: () => void;
  checkInTime: string;
  checkOutTime: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
}

const AttendanceActions = ({
  onClick,
  checkInTime,
  checkOutTime,
  hasCheckedIn,
  hasCheckedOut,
}: Props) => {
  const theme = useTheme();

  return (
    <Grid>
      <ButtonGroup variant="contained" fullWidth sx={{
        minHeight: 90,
        borderRadius: 3,
       "& .MuiButtonGroup-grouped:not(:last-of-type)": {
          borderRight: "1px solid #fff", // garis tengah putih
        },
        overflow: "hidden", // penting biar radius kepake
        "& .MuiButton-root": {
          borderRadius: 0, // biar nyatu rapi
        },
      }} aria-label="Basic button group">
        <Button
          disabled={hasCheckedIn || hasCheckedOut}
          onClick={onClick}
          sx={{
            bgcolor: hasCheckedIn ? "#9E9E9E" : theme.palette.success.main,
            color: "white",
            "&:hover": {
              bgcolor: hasCheckedIn ? "#9E9E9E" : "success.dark",
            },
            "&.Mui-disabled": {
              bgcolor: "#9E9E9E",
              color: "white",
            },
          }}
        >
          <Box textAlign="center">
            <Typography fontWeight="bold">Masuk</Typography>
            <Typography variant="caption">{checkInTime}</Typography>
          </Box>
        </Button>
        <Button
          color="error"
          disabled={!hasCheckedIn || hasCheckedOut}
          onClick={onClick}
          sx={{
            bgcolor: !hasCheckedIn || hasCheckedOut ? "#9E9E9E" : "#F44336",
            color: "white",
            "&:hover": {
              bgcolor:
                !hasCheckedIn || hasCheckedOut ? "#9E9E9E" : "#D32F2F",
            },
            "&.Mui-disabled": {
              bgcolor: "#9E9E9E",
              color: "white",
            },
          }}
        >
          <Box textAlign="center">
            <Typography fontWeight="bold">Pulang</Typography>
            <Typography variant="caption">{checkOutTime}</Typography>
          </Box>
        </Button>
      </ButtonGroup>
    </Grid>
  );
};

export default AttendanceActions;
