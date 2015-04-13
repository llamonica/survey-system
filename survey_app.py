from flask import Flask, request, Response, render_template
from flask_sqlalchemy import SQLAlchemy
import json
from sqlalchemy import UniqueConstraint

survey_app = Flask(__name__)
survey_app.config.from_pyfile('survey.cfg')
db = SQLAlchemy(app=survey_app)

# @survey_app.route('/', methods=['GET'])
# def index():
#     print "rendering index.html"
#     return render_template('index.html')

@survey_app.route('/')
@survey_app.route('/survey', methods=['GET'])
def route_survey():
    message = None

    if request.method == 'GET':
        return render_template('survey.html')


    else:
        message = "Invalid HTTP method: ", request.method

    return render_template('error', message)


@survey_app.route("/cities", methods=['GET'])
def get_cities():
    cities = City.query.all()
    cities_json = []
    for c in cities:
        city = {"id" : c.city_id, "city" : c.city, "state" : c.state}
        cities_json.append(city)
    print "cities:", cities_json
    return json.dumps(cities_json)


@survey_app.route("/vote", methods=['POST'])
def route_vote():
    req_json = request.get_json()
    user_name = req_json['user']
    user_email = req_json['email']
    user = User(user_name, user_email)
    db.session.add(user)
    db.session.commit()
    user_id = user.user_id
    print "user id: ", user_id
    # TODO: check user_id for None

    city_id = req_json['city']
    # Retrieve the city ID from the City table
    assert city_id is not None # TODO: remove after testing

    # Insert the favorite city vote into the Vote table
    vote = Vote(user_id, city_id)
    db.session.add(vote)
    db.session.commit()

    vote_data = Vote.query.all()
    votes_json = {}
    for v in vote_data:
        if v.city_id not in votes_json:
            city_dict = {}
            city = City.query.filter_by(city_id=v.city_id).first()
            city_dict["count"] = 0
            city_dict["city"] = city.city
            city_dict["state"] = city.state
            votes_json[v.city_id] = city_dict
        votes_json[v.city_id]["count"] += 1
    response = Response(json.dumps(votes_json.values()), status=200, content_type="application/json")
    survey_app.process_response(response)

    return response


class User(db.Model):
    __tablename__ = 'user'
    user_id = db.Column('user_id', db.Integer, primary_key=True)
    name = db.Column('name', db.String)
    email = db.Column('email', db.String, unique=True)

    def __init__(self, name, email):
        # TODO: add doc
        # TODO: add db to signature, then add private methods for r
        self.name = name
        self.email = email


class Vote(db.Model):
    """
    Schema for a vote record, which defines a relationship between a user and
    their favorite city.
    """
    __tablename__ = 'vote'
    user_id = db.Column('user_id', db.Integer, primary_key=True) # TODO: add foreign key constraint
    city_id = db.Column('city_id', db.Integer) # TODO: add foreign key constraint

    def __init__(self, user_id, city_id):
        """
        Vote defines a relationship between a user and their favorite city.
        :param user_id: integer ID of the user is the primary key
        :param city_id: integer ID of the city
        :return: None
        """
        self.user_id = user_id
        self.city_id = city_id


class City(db.Model):
    __tablename__ = 'city'
    city_id = db.Column('city_id', db.Integer, primary_key=True)
    city = db.Column('city', db.String)
    state = db.Column('state', db.String)
    __table_args__ = (UniqueConstraint('city', 'state', name='_city_state_uc'),)

    def __init__(self, city, state):
        self.city = city
        self.state = state


if __name__ == '__main__':
    db.drop_all()
    db.create_all()
    db.session.add(City('San Francisco', 'CA'))
    db.session.add(City('New York', 'NY'))
    db.session.add(City('Miami', 'FL'))
    db.session.commit()
    survey_app.run()