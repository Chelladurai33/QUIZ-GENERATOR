package com.quizgen.repository;

import com.quizgen.model.QuizResult;
import com.quizgen.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByUserOrderByCompletedAtDesc(User user);
}
