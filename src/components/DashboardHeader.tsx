// components/DashboardHeader.tsx
import { Box, Container, Avatar, Typography, Grid } from "@mui/material";
import defaultProfileImage from "../assets/default-pp.png";
import bg from '../assets/images/bg.png'
import DateTimeStatusCard from "./DateTimeStatusCard";

interface Props {
  name?: string;
  nip?: string;
  photoURL?: string | null;
  date: string;
  time: string
}

const DashboardHeader = ({ name, nip, photoURL, date, time }: Props) => {
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        py: 3,
        pb: 9,
        // borderBottomLeftRadius: 16,
        // borderBottomRightRadius: 16,

        // FULLSCREEN BACKGROUND
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: '70% center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid size={12}>
            <Box display="flex" alignItems="center">
              <Avatar
                src={photoURL || defaultProfileImage}
                sx={{ width: 56, height: 56 }}
                imgProps={{
                  referrerPolicy: "no-referrer",
                  style: {
                    objectFit: "cover",
                    // Move the visible crop slightly downward so the top of the head isn't cut off
                    objectPosition: "center 20%",
                  },
                  onError: (e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = defaultProfileImage;
                  },
                }}
              />
              <Box ml={2}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Selamat datang,
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {name}
                </Typography>
                <Typography
                  // variant="h9"
                  // fontWeight="bold"
                  sx={{ textTransform: "uppercase" }}
                >
                  {nip ? `${nip}` : ""}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={12}>
            <DateTimeStatusCard date={date} time={time} status="sudah" />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardHeader;
