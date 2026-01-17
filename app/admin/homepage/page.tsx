import { HomepageEditor } from "@/components/admin/HomepageEditor";

export default function AdminHomepagePage() {
  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Homepage Editor</h1>
        <p className="text-gray-600 mt-2">
          Edit your homepage content, sections, and layout
        </p>
      </div>
      
      <HomepageEditor />
    </div>
  );
}
