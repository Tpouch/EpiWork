import RoleBadge from '../components/accounts/RoleBadge';
import ProfileForm from '../components/account/ProfileForm';
import ChangePasswordForm from '../components/account/ChangePasswordForm';

export default function Account({ user, onUserChange }) {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-heading">My account</h2>
        <RoleBadge role={user.role} />
      </div>
      <ProfileForm user={user} onSaved={onUserChange} />
      <ChangePasswordForm />
    </div>
  );
}
