import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        professor: resolve(
          __dirname,
          "src/pages/Registration_professor/professor.html"
        ),
        class: resolve(__dirname, "src/pages/Registration_class/class.html"),
        course: resolve(__dirname, "src/pages/Registration_course/course.html"),
        groups: resolve(__dirname, "src/pages/Registration_groups/groups.html"),
        Report_professor: resolve(
          __dirname,
          "src/pages/Report_professor/Report_professor.html"
        ),
        Report_course: resolve(
          __dirname,
          "src/pages/Report_course/Report_course.html"
        ),
        Report_class: resolve(
          __dirname,
          "src/pages/Report_class/Report_class.html"
        ),
        Report_groups: resolve(
          __dirname,
          "src/pages/Report_groups/Report_groups.html"
        ),
        Profile: resolve(__dirname, "src/pages/Profile/Profile.html"),
      },
    },
  },
});
