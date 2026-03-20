export const SpinnerScreen = ({ message }: { message?: string }) => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 text-center">
          <div className="spinner-border" role="status" aria-label="Loading" />
          <div className="mt-3 text-muted">{message ?? "Loading..."}</div>
        </div>
      </div>
    </div>
  );
};

