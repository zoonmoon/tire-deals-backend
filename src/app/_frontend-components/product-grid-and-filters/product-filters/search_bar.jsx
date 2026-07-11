import React, { useEffect, useState } from "react";
import { Box, Paper, TextField } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import CustomButton from "../../custom-button";

const Button = CustomButton; // rename locally

export default function SearchBar({ prevValue, handleSearch }) {
  const primaryColor = "#0B33A0"; // same as button color

  useEffect(() => setValue(prevValue), [prevValue] )

  const [value, setValue] = useState(prevValue || ""); // ✅ ensure controlled

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && value.length > 2) {
      e.preventDefault(); // prevent form submit / reload
      if (handleSearch) handleSearch(value); // safe call
    }
  };

  return (
    <Paper
      elevation={0}
      // sx={{marginTop:'20px'}}
    >
    <Box
      sx={{
        padding: "16px",
        display: "flex",
        background:'white',
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          border: `1px solid rgba(0, 0, 0, 0.15)`,
          borderRadius: "6px",
          overflow: "hidden",
          width: "100%",
          height: "42px",
        }}
      >
        <TextField
          variant="standard"

          placeholder="Filter by keyword..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown} // ✅ listen for Enter
          InputProps={{
            disableUnderline: true,
            sx: {
              height: "100%",
              px: 2,
              fontSize:'16px'
            },
          }}
          sx={{
            flexGrow: 1,
            fontSize:'16px',
            "& .MuiInputBase-root": {
              height: "100%",
            },
          }}
        />

        {value.length > 2 && (
          
        <Button
          sx={{
            height: "100%",
            borderRadius: 0,
            px: 2.5,
            backgroundColor: primaryColor,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 'bold',
            minWidth: "80px",
            // fontSize: "16px",
            "&:hover": { backgroundColor: "#1565c0" },
          }}
          onClick={() => handleSearch && handleSearch(value)} // ✅ safe guard
        >
          Go
        </Button>
        )}

      </Box>
    </Box>
     </Paper>
  );
}
