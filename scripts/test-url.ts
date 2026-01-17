const key = 'course/92b376b3-d593-4975-a899-b1a0e46d8803/1767101646445-s3q48a.jpg';

const getBunnyCdnUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BUNNY_STORAGE_URL;
  return envUrl || '';
};

if (key.match(/^(lesson|course|logo|favicon)\//)) {
  const bunnyStorageUrl = getBunnyCdnUrl();
  const url = `${bunnyStorageUrl}/${key}`;
  console.log('✅ Constructed URL:', url);
} else {
  console.log('❌ Pattern did not match');
}
