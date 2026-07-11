'use client'
import YMMwidget from ".";

export default function HomePageYMMwidget({endpoint }){

    const callback = () => {
        window.location.href='/search.php'
    }
 

    const glassStyle = {
        background: 'white',                                        
        boxShadow: '0 8px 24px rgba(11,51,160,0.3)',  
        padding: {xs: '20px', md:'15px 40px 30px 40px'},
        
    };

    return  (
    <div style={{marginTop:'30px', marginBottom:'30px'}}> 

        <YMMwidget 
            endpoint={endpoint}
            orientation={"horizontal"}
            heading={"Select your Vehicle"}
            callback={callback}
            containerStyles={glassStyle}
            buttonStyles={{color:'white', background: 'black'}}
            headingStyles={{color:'black', fontSize:'32px', }}
            selectDisabledOpacity={0.6}
        />

    </div>
    )


}