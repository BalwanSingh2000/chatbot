// import "./global.css"

// export const metadata={
//     title: "Counsel India Support",
//     description: "the place to get all your answers related to counsel india"
// }


// const RootLayout = ({children})=>{
//     return(
//         <html>
//             <body>
//                 {children}
//             </body>
//         </html>
//     )
// }

import "./global.css";

export const metadata = {
  title: "Counsel India Support",
  description: "the place to get all your answers related to counsel india",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
    <body suppressHydrationWarning={true}>
      {children}
    </body>
  </html>
  );
};

export default RootLayout;
