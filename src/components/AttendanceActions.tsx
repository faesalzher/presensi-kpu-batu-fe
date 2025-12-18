// components/AttendanceActions.tsx
import { Grid, Button, Typography, Box, useTheme } from "@mui/material";

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
    <Grid container spacing={2}>
      <Grid size={6}>
        <Button
          fullWidth
          variant="contained"
          disabled={hasCheckedIn || hasCheckedOut}
          onClick={onClick}
          sx={{
            height: 90,
            borderRadius: 3,
            bgcolor: hasCheckedIn ? "#9E9E9E" : theme.palette.success.main,
            "&:hover": {
              boxShadow: theme.shadows[4],
              bgcolor: theme.palette.success.dark,
            },
          }}
        >
          <Box textAlign="center">
            <Typography fontWeight="bold">Masuk</Typography>
            <Typography variant="caption">{checkInTime}</Typography>
          </Box>
        </Button>
      </Grid>

      <Grid size={6}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          disabled={!hasCheckedIn || hasCheckedOut}
          onClick={onClick}
          sx={{ height: 90, borderRadius: 3 }}
        >
          <Box textAlign="center">
            <Typography fontWeight="bold">Pulang</Typography>
            <Typography variant="caption">{checkOutTime}</Typography>
          </Box>
        </Button>
      </Grid>
    </Grid>
  );
};

export default AttendanceActions;
