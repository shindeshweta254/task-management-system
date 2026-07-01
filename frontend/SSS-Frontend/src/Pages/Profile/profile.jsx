import Layout from "../../Components/Layout/Layout";

function Profile() {
  return (
    <Layout title="Profile">
      <div className="page-card">
        <h2>Admin Profile</h2>
        <p><b>Name:</b> Harsh Sharma</p>
        <p><b>Role:</b> Admin</p>
        <p><b>Email:</b> admin@sssfacility.com</p>
        <p><b>Company:</b> SSS Facility Services</p>
      </div>
    </Layout>
  );
}

export default Profile;