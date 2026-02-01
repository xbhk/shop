# REVISION HISTORY v1.0
Published on 12 Jan 2026

# IEMS5718 WEB PROGRAMMING AND INTERNET SECURITY (2025-26 TERM 2) ASSIGNMENT MARKING CHECKLIST V1

## PHASE 1: LAYOUT (DEADLINE: 1 FEB 2026)
(SUBTOTAL: 14')

The appearance of a website plays a big role in attracting visitors. In Phase 1, you will create a dummy shopping website from scratch by hardcoding the basic elements. (dummy means categories and products are only for the purpose of displaying. Customers cannot purchase goods at this moment.)

Figure 1 shows an example of a shopping website layout. Note that the layout you design must be different from the example we provide, at the meantime involving all the necessary features we list below. You can draw your inspiration by referencing popular shopping websites (I.e. https://pns.hk, https://www.walmart.com).

### Declaration:
1. JavaScript is NOT necessary at this phase.
2. Front-end frameworks are allowed in designing your website.
[image.png]

### Requirements:
1. HTML: Make good use of semantic HTML throughout the whole assignment. (e.g., <header>, <nav>, <footer>, <div>, <section>, <ul>, <li>…) /2'
2. CSS: Proper management of HTML, CSS, JS code and files throughout the whole assignment. /2'
   - Separating HTML, JS, CSS; Exceptions: e.g., JSX (React)
   - No inline CSS style or HTML for styling use, e.g., align="center", etc.
3. Main page demonstrates the use of “CSS tableless” product list /2'
   - Each product has at least its own thumbnail, name, price and addToCart button. One approach is to use flexbox.
   - When the thumbnail or name is clicked, redirect to the corresponding product page.
4. Main page demonstrates the use of “hover” shopping list /3'
   - When displayed, it will cover any elements behind (e.g., using CSS)
   - Input boxes are used for inputting the quantity of each selected product.
   - A checkout button that will be used to submit the list to Payment Gateway (later)
   - The shopping list is displayed in both main and product pages.
   - Responsive design: instead of hover, you can allow clicking on the shopping list to open/close it.
5. Product page provides product details /2'
   - To show a full-size or bigger image, name, description, price, and addToCart button.
6. Both main and product pages should include a hierarchical navigation menu /3'
   - e.g. Home or Home > Category1 or Home > Category1 > Product1
   - They are hyperlinks that can redirect users to an upper level of the hierarchy.
7. (Extension) In the Product Page, allow multiple images or videos to be shown in the area. /?'
   - Allow users to slide/select/view different images (cf. Amazon, pns)
   - Keyword: Image Slider. You may use libraries like SwiperJS.
   - Note that you don’t have to implement it in this phase, as it may change your backend server logic. You may use some sample images for testing at this stage.

## PHASE 2A: SECURE SERVER SETUP (DEADLINE: 8 FEB 2026) SUBJECT TO CHANGE
(SUBTOTAL: 8')

In this phase, you are required to set up a secure server for later development. Some guidance will be given in the tutorial.

### Requirements:
1. Instantiate a free Virtual Cloud Machine (Azure, Amazon EC2 or other free VPS, e.g., GCP, Digital Ocean)
   - Azure student account: https://azure.microsoft.com/en-us/free/students (Do not require Credit Card)
   - AWS Free Usage Tier: http://aws.amazon.com/free/ (Credit Card required)
   - With a Linux distribution, install only Apache/Nginx, Node JS and SQLite (MySQL is NOT RECOMMENDED as your Free VM cannot handle it.)
   - To minimize attack surfaces, always install only what you need.
2. Apply necessary security configurations /5'
   - Apply proper firewall settings at Cloud: block all ports but 22, 80 and 443 only.
   - Apply proper updates for the server software packages in a regular manner.
   - Hide the versions of OS, Web Server and Node in HTTP response headers.
   - Do not display any warnings and errors to the end users.
   - Disable directory index in Web Server.
3. Configure the VM so that your website is accessible at http://sxx.iems5718.iecuhk.cc /2'
   - Apply for a static public IP, and ALWAYS associate it with the instantiated VM.
   - Submit your Static IP (or Domain name) through Microsoft Forms before the deadline.
   - TA will then assign you a domain name and configure the DNS mapping for you.
   - Upload all your pages to the server. They should then be accessible through:
     - http://[your-own-public-IP]/, or
     - http://sxx.iems5718.iecuhk.cc
   - If you are using Azure Web Services, then your website should be accessible at a Static IP. You are advised not to use App Service.

### Webform (Require Login CUHK account):
https://forms.office.com/r/z3FMwGupdt

If your IP/Domain is updated after the deadline, please send an email to TA/Instructor.