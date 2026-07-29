'use client'

import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { useEffect, useState } from "react";

export default function WhopCheckoutWidget() {

	const [isLoading, setIsLoading] = useState(true) 

	const [checkoutConfig, setCheckoutConfig] = useState(false)

	const createCheckoutConfig = async  () => {

		try{

			let checkoutConfigDataResp = await fetch('/api/whop-checkout/create-checkout-config')

			let checkoutConfigData = await checkoutConfigDataResp.json() 

			if(!(checkoutConfigData.checkoutConfig)) throw new Error("Error fetching data") 

			setCheckoutConfig(checkoutConfigData.checkoutConfig)

		}catch(error){

			console.log(error)

		}finally{
			setIsLoading(false) 
		}

	}

	useEffect(() => {
		
		createCheckoutConfig()

	}, [])

	if(isLoading) return "loading"

	if(!checkoutConfig) return ("failed")
	
	console.log(checkoutConfig)
	
	return (
		<div style={{width:"400px"}}>
			
		<WhopCheckoutEmbed
		    sessionId={checkoutConfig.id}			
			returnUrl="https://yoursite.com/checkout/complete"
			onComplete={(paymentId) => {
				console.log("Payment complete:", paymentId);
			}}

		/>

		</div>

	);
}

