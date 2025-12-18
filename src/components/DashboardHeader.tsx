// components/DashboardHeader.tsx
import { Box, Container, Avatar, Typography } from "@mui/material";
import defaultProfileImage from "../assets/default-pp.png";
import bg from '../assets/images/bg.png'

interface Props {
  name?: string;
  role?: string;
  nip?: string;
  photoURL?: string | null;
}

const DashboardHeader = ({ name, role, nip, photoURL }: Props) => {
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        py: 3,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,

                // FULLSCREEN BACKGROUND
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: '70% center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center">
          <Avatar
            src={photoURL || defaultProfileImage}
            sx={{ width: 56, height: 56 }}
          />
          <Box ml={2}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Selamat datang,
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {name}
            </Typography>
            <Typography
              // variant="h9 "
              // fontWeight="bold"
              sx={{ textTransform: "uppercase" }}
            >
              {role} {nip ? `• ${nip}` : ""}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DashboardHeader;
