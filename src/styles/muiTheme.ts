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
      main: '#4CAF50',
      dark : "#3f7741ff"
    }
  },
  shape: {
    // borderRadius: 4
  },
  typography: {
    fontFamily: [
      'Montserrat',
      '"Helvetica Neue"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif'
    ].join(',')
  },
})
