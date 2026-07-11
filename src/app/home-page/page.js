import HomePageYMMwidget from "../_frontend-components/ymm-widget/home-page-widget";

export default function Index(){
    return <HomePageYMMwidget 
        orientation={'horizontal'}
        endpoint={'http://localhost:3000'}
        heading={'Select your Vehicle'}
    />
}