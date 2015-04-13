from flask import Flask, request, Response, render_template
from flask_sqlalchemy import SQLAlchemy
import json
from sqlalchemy import UniqueConstraint

survey_app = Flask(__name__)
survey_app.config.from_pyfile('survey.cfg')
db = SQLAlchemy(app=survey_app)

@survey_app.route('/', methods=['GET'])
def route_survey():
    """
    Routes to the main page (currently the only page) in the app.
    :return: Main page HTML
    """
    return render_template('survey.html')


@survey_app.route("/cities", methods=['GET'])
def get_cities():
    """
    Provides the collection of city objects from the db.
    :return: JSON string containing list of city objects
    """
    cities = City.query.all()
    cities_json = []
    for c in cities:
        city = {"id" : c.city_id, "city" : c.city, "state" : c.state}
        cities_json.append(city)
    print "cities:", cities_json
    return json.dumps(cities_json)


@survey_app.route("/vote", methods=['POST'])
def route_vote():
    """
    Processes a vote request, adding the vote to the db, then returning the
    votes cast so far.
    :return: JSON string containing counts of votes for each city
    """
    req_json = request.get_json()

    # Get user data from request
    user_name = req_json['user']
    user_email = req_json['email']
    if user_name == '' or user_email == '':
        response = Response("Incomplete user data provided.", status=500)
        survey_app.process_response(response)
        return response
    user = User(user_name, user_email)

    # Add user to db
    db.session.add(user)
    try:
        db.session.commit()
    except:
        db.session.rollback()
        response = Response("User with email, " + user_email + ", has already voted.", status=500)
        survey_app.process_response(response)
        return response

    user_id = user.user_id

    city_id = req_json['city']

    # Insert the favorite city vote into the Vote table
    vote = Vote(user_id, city_id)
    db.session.add(vote)
    db.session.commit()

    # Build votes JSON for response
    votes_json = {}
    cities = City.query.all()
    for city in cities:
        city_dict = {"count": 0, "city": city.city, "state": city.state}
        votes_json[city.city_id] = city_dict

    vote_data = Vote.query.all()
    for v in vote_data:
        votes_json[v.city_id]["count"] += 1
    response = Response(json.dumps(votes_json.values()), status=200, content_type="application/json")
    survey_app.process_response(response)

    return response


class User(db.Model):
    """
    User SQL schema.
    """
    __tablename__ = 'user'
    user_id = db.Column('user_id', db.Integer, primary_key=True)
    name = db.Column('name', db.String)
    email = db.Column('email', db.String, unique=True)

    def __init__(self, name, email):
        """
        User defines a voter using the system.
        :param name: user name string
        :param email: user email string
        :return: None
        """
        self.name = name
        self.email = email


class Vote(db.Model):
    """
    Schema for a vote record, which defines a relationship between a user and
    their favorite city.
    """
    __tablename__ = 'vote'
    user_id = db.Column('user_id', db.Integer, primary_key=True, unique=True) # TODO: add foreign key constraint
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
    """
    City SQL schema.
    """
    __tablename__ = 'city'
    city_id = db.Column('city_id', db.Integer, primary_key=True)
    city = db.Column('city', db.String)
    state = db.Column('state', db.String)
    __table_args__ = (UniqueConstraint('city', 'state', name='_city_state_uc'),)

    def __init__(self, city, state):
        """
        City defines a city-state pair that can be voted.
        :param city: string name of city
        :param state: string name of state
        :return:
        """
        self.city = city
        self.state = state


if __name__ == '__main__':
    # db.drop_all()
    db.create_all()
    try:
        db.session.add(City('San Francisco', 'CA'))
        db.session.add(City('New York', 'NY'))
        db.session.add(City('Miami', 'FL'))
        db.session.commit()
    except:
        db.session.rollback()
    survey_app.run()