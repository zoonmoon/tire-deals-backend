'use client'
import Intercom from '@intercom/messenger-js-sdk';
import { Button, Container, Paper } from '@mui/material';
import Link from 'next/link';



Intercom({
  app_id: 'tjn7j4ly',
});

export default function Page(){
  return  (
    <Container maxWidth={'sm'} sx={{marginTop:'20px'}}>
      <Paper sx={{p:3}}>

          <Link href={'/frontend/whop-payment'}>
            <Button variant={'contained'}>
              Test Whop Payment Feature
            </Button>
          </Link>
          <div style={{marginTop:'20px'}}></div>
          <Link href={'/frontend/shop-by-vehicle'}>
            <Button variant={'contained'}> 
              Test Y/M/M search 
            </Button>
          </Link>      


      </Paper>
    </Container>

  )
}