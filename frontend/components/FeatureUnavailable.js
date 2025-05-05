// components/FeatureUnavailable.js
export default function FeatureUnavailable() {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Cette fonctionnalité est en cours de développement.
            </p>
          </div>
        </div>
      </div>
    );
  }