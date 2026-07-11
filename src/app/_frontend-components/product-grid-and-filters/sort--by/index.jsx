import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function SortBy({sort_by, handleSortByChange}) {

  const handleChange = (event) => {
    handleSortByChange(event.target.value)
  };

  return (
    <Box sx={{minWidth:'140px', fontSize:'14px', padding:0 }}>
      <FormControl  fullWidth sx={{background:'white', maxHeight:'50px', padding:0}}>
        <InputLabel id="demo-simple-select-label" sx={{fontSize:'14px',
          
             // Only when NOT selected
    "&:not(.MuiInputLabel-shrink)": {
      marginTop: "-5px",
    },
          paddingTop:'0px', paddingBottom: '0px'}}>Sort By</InputLabel>
        <Select
        
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={sort_by}
          label="Sort By"
          sx={{fontSize:'14px', display:'flex', justifyContent:'center', alignItems:'center',  maxHeight:'40px', padding:'0px'}}
          onChange={handleChange}
        >
          <MenuItem sx={{fontSize:'14px'}} value={'price-high-to-low'}>Price High to Low</MenuItem>
          <MenuItem sx={{fontSize:'14px'}} value={'price-low-to-high'}>Price Low to High</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
