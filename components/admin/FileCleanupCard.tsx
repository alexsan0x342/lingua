"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCleanupFiles } from "@/hooks/use-deletion";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";

export function FileCleanupCard() {
  const [isConfirming, setIsConfirming] = useState(false);

  const { cleanupFiles, isCleaning } = useCleanupFiles({
    onSuccess: () => {
      toast.success("File cleanup completed successfully");
      setIsConfirming(false);
    },
    onError: (error) => {
      toast.error(error || "Failed to cleanup files");
    }
  });

  const handleCleanup = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    
    cleanupFiles();
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          File Cleanup
        </CardTitle>
        <CardDescription>
          Remove orphaned files that exist in storage but are not referenced in the database.
          This helps free up storage space and keep your file system clean.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConfirming ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                What does this do?
              </h4>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Scans local image storage for unused files</li>
                <li>• Compares with database references</li>
                <li>• Removes files that are no longer needed</li>
                <li>• Does not affect Mux videos (managed separately)</li>
              </ul>
            </div>
            
            <Button onClick={handleCleanup} variant="outline" disabled={isCleaning}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isCleaning ? "animate-spin" : ""}`} />
              {isCleaning ? "Cleaning..." : "Start Cleanup"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-medium text-sm text-yellow-900 dark:text-yellow-100">
                ⚠️ Confirm File Cleanup
              </h4>
              <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-200">
                This action will permanently delete orphaned files from your local storage. 
                Make sure you have backups if needed.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCleanup} 
                variant="destructive" 
                disabled={isCleaning}
              >
                <Trash2 className={`w-4 h-4 mr-2 ${isCleaning ? "animate-spin" : ""}`} />
                {isCleaning ? "Cleaning..." : "Confirm Cleanup"}
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline"
                disabled={isCleaning}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
