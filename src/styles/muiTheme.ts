// src/theme/muiTheme.ts
import { createTheme } from '@mui/material/styles'

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#771414',
      dark: '#500e0eff'
    },
    secondary: {
      main: '#10b981'
    },
    error: {
      main: '#ef4444'
    },
    success: {
      main: '#308b33ff',
      dark: "#3f7741ff"
    },
    text: {
      primary: "#1f2937",   // abu tua (teks utama)
      secondary: "#6b7280", // abu medium (helper, label, caption)
      disabled: "#9ca3af",  // teks non-aktif
    },

  },
  shape: {
    // borderRadius: 3
  },
  typography: {
    fontFamily: [
      'Montserrat',
      '"Helvetica Neue"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif'
    ].join(','),
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.85rem",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.75rem",
      color: "#6b7280",
    },
  },
})
