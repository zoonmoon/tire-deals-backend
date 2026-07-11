import React, { useState } from "react";
import {  Box, Drawer, Typography } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
// import { Button } from "@mui/joy";
import CloseIcon from '@mui/icons-material/Close';
// import Button from '@mui/material/Button';

import CustomButton from "../../custom-button";
const Button = CustomButton; // rename locally

export default function FilterDrawer({scrollToElementTopById, uiComponent, filtersSelected, appliedFilters}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Button to open drawer */}
      <Button sx={{padding:'10px 20px'}} startDecorator={<FilterAltIcon />} onClick={() => setOpen(true)}>
        Filter
      </Button>

      {/* Drawer sidebar */}
      <Drawer  anchor="left" open={open} onClose={() => setOpen(false)}>

        <Box sx={{ width:{xs:'330px', md:'400px'} }}>


            <div  className="custom-scroll" style={{ borderBottom:'1px solid rgba(0,0,0,0.1)', padding: '10px 20px',  position:'sticky', top: '0px',zIndex: 23244, background:'white' }}>
                <div style={{alignItems:'center', display:'flex', justifyContent:'space-between'}}>
                    <Typography variant="h6">Filters</Typography>
                    <Button 
                      sx={{
                        width:'120px',
                        paddingTop:'13px',
                        paddingBottom:'13px'
                      }} 
                      onClick={() => {scrollToElementTopById(); setOpen(false)}}
                    >
                      Close
                    </Button>
                </div>
                {
                    filtersSelected && (
                        <div style={{marginTop:'20px'}}>
                            {appliedFilters}
                        </div>
                    )
                }

            </div>
   
            <div >
                {uiComponent}
            </div>

        </Box>



      </Drawer>
    </>
  );
}
