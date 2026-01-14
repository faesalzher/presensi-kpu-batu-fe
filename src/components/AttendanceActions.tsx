// components/AttendanceActions.tsx
import { Grid, Button, Typography, Box, useTheme, ButtonGroup } from "@mui/material";
import { WorkingDayResponse } from "../types/system";

interface Props {
  onClick: () => void;
  checkInTime: string;
  checkOutTime: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  workingDayToday: WorkingDayResponse | null;
}

const AttendanceActions = ({
  onClick,
  checkInTime,
  checkOutTime,
  hasCheckedIn,
  hasCheckedOut,
  workingDayToday
}: Props) => {
  const theme = useTheme();

  return (
    <Grid>
      <ButtonGroup variant="contained" fullWidth sx={{
        minHeight: 70,
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
          disabled={hasCheckedIn || hasCheckedOut || workingDayToday?.isHoliday}
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
            <Typography variant="body2">{checkInTime}</Typography>
          </Box>
        </Button>
        <Button
          color="error"
          disabled={!hasCheckedIn || hasCheckedOut || workingDayToday?.isHoliday}
          onClick={onClick}
          sx={{
            bgcolor: !hasCheckedIn || hasCheckedOut || workingDayToday?.isHoliday ? "#9E9E9E" : "#ff9800",
            color: "white",
            "&:hover": {
              bgcolor:
                !hasCheckedIn || hasCheckedOut || workingDayToday?.isHoliday ? "#9E9E9E" : "#f57c00",
            },
            "&.Mui-disabled": {
              bgcolor: "#9E9E9E",
              color: "white",
            },
          }}
        >
          <Box textAlign="center">
            <Typography fontWeight="bold">Pulang</Typography>
            <Typography variant="body2">{checkOutTime}</Typography>
          </Box>
        </Button>
      </ButtonGroup>
    </Grid>
  );
};

export default AttendanceActions;
