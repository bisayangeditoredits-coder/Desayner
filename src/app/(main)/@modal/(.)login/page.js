import AuthModalWrapper from '@/components/AuthModalWrapper';
import LoginForm from '@/components/LoginForm';

export default function InterceptedLoginPage() {
  return (
    <AuthModalWrapper>
      <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <LoginForm isModal={true} />
      </div>
    </AuthModalWrapper>
  );
}
