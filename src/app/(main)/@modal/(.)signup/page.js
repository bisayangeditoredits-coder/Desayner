import AuthModalWrapper from '@/components/AuthModalWrapper';
import SignupForm from '@/components/SignupForm';

export default function InterceptedSignupPage() {
  return (
    <AuthModalWrapper>
      <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <SignupForm isModal={true} />
      </div>
    </AuthModalWrapper>
  );
}
