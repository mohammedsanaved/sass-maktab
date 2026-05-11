// // src/lib/theme-script.ts
// export const themeScript = `
//   (function() {
//     const savedTheme = localStorage.getItem('theme');
//     const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
//     const theme = savedTheme || (systemTheme ? 'dark' : 'light');

//     if (theme === 'dark') {
//       document.documentElement.classList.add('dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//     }
//   })();
// `;
