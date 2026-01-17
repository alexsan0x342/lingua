import { getAllCategories } from "@/app/data/admin/get-categories";
import CreateCourseForm from "./_components/CreateCourseForm";

export default async function CourseCreationPage() {
  const categories = await getAllCategories();
  
  return <CreateCourseForm categories={categories} />;
}
