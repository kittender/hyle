import mlflow


def train(dataset, params, seed=42):
    mlflow.set_experiment("user-churn")
    with mlflow.start_run():
        mlflow.log_params(params)
        mlflow.log_param("dataset_hash", dataset.content_hash())
        mlflow.log_param("seed", seed)

        model = build_model(params, seed=seed)
        for epoch in range(params["epochs"]):
            loss = model.fit_epoch(dataset.train)
            mlflow.log_metric("loss", loss, step=epoch)

        acc = model.evaluate(dataset.test)
        mlflow.log_metric("accuracy", acc)
        mlflow.sklearn.log_model(model, "model")
    return model
