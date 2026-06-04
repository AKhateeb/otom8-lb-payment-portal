Create a high-standard Vue 3 CSR app using Vite for a focused payment-collection portal.

## App purpose:
This app will be deployed and sent its link for our users to pay for our services, the app should interface the payment with the backend and ensure payment flow is done correctly,


## Reference app:
[Check the app here C:\Users\Abed\Documents\GitHub\smart-ads. The Vue app should match the same UX, flow, and behavior where applicable.]
you can also get 
we want to deploy this app to smartads domain with subdomain "pay." so user seems this app theme, and also to another app found here (C:\Users\Abed\Documents\GitHub\ejet-elkahraba-app) you can check its .env 

## Flow Explained
- welcome page shows app logo, emotional sales sentences, CTA to start
- ask user to enter phone number registered in the app (themed with the app colors)
- ask user to pick a payment method (get them from the referenced app)
- if method is sms, ask user to enter  the phone number he wants to send from and add option if user wants to use same of the entered phone from last step (make it easy and less friction)
- follow the same steps for each method as you can see in the app (no restrictions of having same field)
- remember to have a page for payment summary and confirmm CTA
- once payment is done (if promocode so redeemd, if sms or whish so it's validated, ...etc) explode confetti as the reference app, and tell user to check the app as it's automatically activated
- no need for the cash agent, so ignroe it for now
- show validation erorr if sms-units will be transferred from non-lebanese phones
- for the whish payment, user after running the whish payment link, the payment-gateway asks user to enter his whish phone number, then they send OTP as notification to their app of account related to the phone number entered, user needs to enter it, then they redirect user to payment successful or failure

## Notes:
- you can get API info and urls needed from the .env reference app
- we need the app identity to be dynamic, like logo/colors/fonts/titles/app-name/...etc we can edit from one place in case we want to apply this payment portal for other projects
- better to have the flow as steps, wizard, very intuitive and user-friendly UIs
- use advanced nice field input for phone numbers where you default to LB but user can select any other country
- I need it very modern, very responsive to desktop/labtop/mobile/tablet layouts
- include some live backgrounds to add liveness to the app
- document the app in detailed file, and add summary in README
- errors should be fired in a nice way to attract user eyes
- user nice icons of a unified style (for example material design or any others)
- don't pass 400,401,403,404,500,502,503 errors as is from backend, you should show user-friendly error msg instead
- don't ask user about his prefered language, your app should detect user browser lang if it's AR then use AR otherwise fallback to English for all non-AR langs
- usr should always be able to go back in case he wants to edit some info (but not after confirmation)
- you should show the explaination steps images in a nice way similar to what we've done in the reference app with good sizes
- if user wants to close the active tab and it has already filled info, then show alert or anything to let user confirm to discard the filled info
- show a nice slim progressbar like steps or smoth moving bar to help user understand the flow
- use nice spinner while fetching from backend and show helpful sentences while user is waiting
- always use proper validation and limit the input length and sanitize before submit to avoid having suspicious content
- if you need to use decimals, we allow only two digits after the decimal point (I think most numbers are integer)
- remember to test and validate your work with actual test-case and submission to backend, to make sure it's working perfectly, I only want to have a quick test locally then run command: `firebase deploy` after initiating the project
- for testing which payments use this phone 70902894 and otp is 111111, and for testing the sms-units use the POST request below 
- add ability to set debug mode or production mode where you allow sms phone in debug mode but not in production, and whish  pay credentials are different in production mode so we can run debug locally (with sandbox) and deploy production (with live) when we want



## Requirements:
- Vue 3 + Vite, CSR only
- Composition API
- Vue Router
- Pinia
- Axios
- Firebase config (this app will be deployed on firebase hosting)
- Connection to Directus API
- Tailwind CSS
- Mobile-first responsive design
- Clean, scalable folder structure
- Professional SaaS-quality UI/UX
- Must be in English/Arabic
- Secure auth structure
- Protected routes
- API service layer
- Loading, empty, and error states
- Reusable components only where useful
- Clear Architecture, no overengineering

## Helpful Requests

```
curl --location 'https://{base-url}/sms-gateway/webhook' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer 5gm5ODtpuuNrkUtFr95TbA61wfcxksMF' \
--data '{
    "date_sms_received": "2026-06-04T09:24:44.793Z",
    "mobile_operator": "alfa",
    "amount": 3,
    "phone_number": "+96171500080", 
    "raw_text": "Dear customer, $3.0 were transferred to your balance from the mobile number +96171500080.",
    "reference": "any random int"
}
```


Keep the app simple, focused, and production-ready. Do not add unrelated features.

