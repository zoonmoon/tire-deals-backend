import { CircularProgress } from "@mui/material";

export default function LoadingSpinner() {
  return(
    <div
      style={
        {
          position:'fixed',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          display:'flex',
          justifyContent:'center',
          alignItems:'center',
          background:'rgba(255,255,255,0.5)',
          zIndex: 99999999999999,
        }
      }
    >
      <div style={{width: '100px', borderRadius:'50%', height:'100px', background:'white', display:'flex', justifyContent:'center', alignItems:'center'}}>
        <CircularProgress sx={{color: '#0B33A0'}} />
      </div>


    </div>
  )
}