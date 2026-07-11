"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  Modal,
  Button
} from "@mui/material";

import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import YMMwidget from ".";

    function notifyVehicleChange() {
        window.dispatchEvent(
            new CustomEvent("ymm-vehicle-changed-from-add-to-garage", {
            
            })

        );
    }

const STORAGE_KEY = "ymm_history";
const PRIMARY = "black";
const ACTIVE_SHADOW = "0 5px 10px rgba(32, 136, 224, 0.35)";

export default function GarageVehicleWidget({ endpoint, page_type='' }) {
  
  const [vehicles, setVehicles] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    loadVehicles();
  }, []);

  function loadVehicles() {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setVehicles(arr);
  }

  const selectedVehicle =
    vehicles.find(v => v.selectedFlag) ||
    vehicles.sort((a, b) => b.timestamp - a.timestamp)[0];

  function vehicleLabel(v) {
    if (!v?.fullObj) return "";
    return Object.values(v.fullObj).map(x => x.label).join(" ");
  }





  function selectVehicle(realIndex) {
    const updated = vehicles.map((v, i) => ({
      ...v,
      selectedFlag: i === realIndex,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setVehicles(updated);

    notifyVehicleChange()



    setAnchorEl(null);
  }

  const orderedVehicles = [
    ...vehicles.filter(v => v.selectedFlag),
    ...vehicles.filter(v => !v.selectedFlag),
  ];


    const clearVehicle = () => {
        setVehicles([])
        setAnchorEl(null);
        localStorage.removeItem("ymm_history");
        setTimeout(() => {
            notifyVehicleChange()
        }, 10);
    }
      
  return (
    <>
      {/* SELECT */}
      <Box sx={{ padding:0,margin: 0, width:'100%',  maxWidth: {xs:'100%', md: '300px'}, boxSizing:'border-box', }}>
        <Box
          onClick={(e) =>
            vehicles.length ? setAnchorEl(e.currentTarget) : setOpenModal(true)
          }
          sx={{
            background: PRIMARY,
            color: "#fff",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
            border:"1px solid white", 
            borderBottom: 0,
            justifyContent:"center",
            borderRadius: {xs: 0, md:"6px 6px 0 0" } ,
          }}
        >
          <DirectionsCarIcon />
          <Typography
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display:'flex',
              alignItems:'center',
              fontWeight: 500,
            }}
          >
            {vehicles.length ? <strong>{vehicleLabel(selectedVehicle)}</strong>  : <strong>Select your vehicle</strong>}
          </Typography>

            

          {vehicles.length > 0 && (<KeyboardArrowDownIcon />)}
          
        </Box>
            
        {/* MENU */}
        <Menu
          anchorEl={anchorEl}
          
          open={openMenu}
          onClose={() => setAnchorEl(null)}
          disablePortal
          PaperProps={{
            sx: {
              position:'relative',
              width: '100%',
              // left: { xs: '0!important', md: 'auto!important' },
              maxWidth: {xs:'100%', md: '300px'},
              marginTop:{xs: '0px', md: '10px'},
              textOverflow:'ellipsis',
              boxSizing:'border-box',
              marginLeft: {xs: '-16px', md: 0}
            //   borderRadius: "0 0 8px 8px",
              
            },
          }}
        >
          <Box
          
            sx={{

              maxHeight: "40vh",
              overflowY: "auto",
              p: 1.4,
              paddingTop: 0,
            }}
          >

          <Box sx={{  mb:1.5, pb: 1.5, mt: 0,   borderBottom: '1px solid rgba(0, 0,0,0.07)' }}>
            <div
              style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between'
              }}
            >

                <Typography
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display:'flex',
                    alignItems:'center',
                    fontWeight: 600,
                  }}
                >
                  My Garage
                </Typography>
      
                <Button
                  variant="outlined"
                  hoverBackgroundColor="white"

                  sx={{
                      borderRadius: 0,
                      background: "white",
                      // border: '1px solid red',
                      color: 'red',
                      borderTop: "none",
                      borderRight: 'none',
                      textTransform: "none",
                      borderLeft: 'none',
                      borderBottom: "1px solid red",
                      paddingBottom: "5px",
                      padding: 0,
                      fontWeight: 400,
                      
                  }}
                  onClick={() => clearVehicle()}
              >
                  Clear
              </Button>
              
            </div>
            
            </Box>
            
            {orderedVehicles.map(v => {
                  const isSelected = v.selectedFlag;
                  const realIndex = vehicles.findIndex(x => x === v);

                  return (
                    <MenuItem
                      key={realIndex}
                      disableGutters
                      onClick={() => selectVehicle(realIndex)}
                      sx={{
                          //   p: 2,
                          mb: 0.1,
                                  
                          width: "100%",
                          padding: "10px",
                          borderRadius: "6px",
        
                          fontWeight: isSelected ? 600 : 400,
                          // boxShadow: isSelected ? ACTIVE_SHADOW : "none",
                          background:isSelected ?  'rgba(11, 51, 160, 0.06)' : ''

                      }}
                    >
                      {/* 👇 THIS IS THE CARD */}
                      <Box
                          sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",

                          }}
                      >
                            {vehicleLabel(v)}
                      </Box>
                      
                      
                    </MenuItem>
                  );
                })}

          </Box>
    


  <Box sx={{ mt:0,p: 1.4, pt:2, borderTop: '1px solid rgba(0, 0,0,0.07)' }}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                background: 'black',
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
              }}
              onClick={() => {
                setAnchorEl(null);
                setOpenModal(true);
              }}
            >
              Add New Vehicle
            </Button>
          </Box>

        </Menu>
        

      </Box>

      {/* MODAL */}
      <Modal 
         sx={{border:'none'}} 
         open={openModal} 
        
         onClose={() => setOpenModal(false)} disableScrollLock
        >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            padding: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#fff",
            // padding: 4,
            // borderRadius: "8px",
            width: { xs: "95%", md: 500 },
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <YMMwidget
            endpoint={endpoint}
            headingStyles={{color: 'black'}}
            containerStyles={{
          
              background: 'white',                                        
              boxShadow: '0 8px 24px rgba(11,51,160,0.3)',  
              padding: {xs: '25px', md: '30px 30px'} 

            }}
            heading="ADD YOUR VEHICLE"
            callback={() => {
              // setOpenModal(false);
              // loadVehicles();
              notifyVehicleChange()
            }}
          />
        </Box>
      </Modal>
    </>
  );
}
