from extensions import db


class Worker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roles = db.Column(db.JSON, nullable=False)
    availability = db.Column(db.JSON, nullable=False)

    def __repr__(self):
        return f"<Worker {self.name}>"
